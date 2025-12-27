import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  type: 'sales_agent' | 'customer' | 'route' | 'contract';
  title: string;
  subtitle: string;
  url: string;
}

export const useGlobalSearch = (query: string) => {
  return useQuery({
    queryKey: ['global_search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const searchTerm = `%${query.toLowerCase()}%`;
      const results: SearchResult[] = [];

      // Search Sales Agents
      const { data: agents } = await supabase
        .from('sales_agents')
        .select('id, name, agent_code, phone')
        .or(`name.ilike.${searchTerm},agent_code.ilike.${searchTerm},phone.ilike.${searchTerm}`)
        .limit(5);

      if (agents) {
        agents.forEach(agent => {
          results.push({
            id: agent.id,
            type: 'sales_agent',
            title: agent.name,
            subtitle: `Kode: ${agent.agent_code}${agent.phone ? ` | ${agent.phone}` : ''}`,
            url: `/sales-agents?highlight=${agent.id}`,
          });
        });
      }

      // Search Customers
      const { data: customers } = await supabase
        .from('customers')
        .select(`
          id, 
          name, 
          customer_code, 
          address, 
          phone,
          routes(code, name)
        `)
        .or(`name.ilike.${searchTerm},customer_code.ilike.${searchTerm},address.ilike.${searchTerm},phone.ilike.${searchTerm}`)
        .limit(5);

      if (customers) {
        customers.forEach(customer => {
          results.push({
            id: customer.id,
            type: 'customer',
            title: customer.name,
            subtitle: `Kode: ${customer.customer_code || 'N/A'}${customer.address ? ` | ${customer.address}` : ''}${(customer.routes as any)?.code ? ` | Route: ${(customer.routes as any).code}` : ''}`,
            url: `/customers?highlight=${customer.id}`,
          });
        });
      }

      // Search customers by route code
      const { data: customersByRoute } = await supabase
        .from('customers')
        .select(`
          id, 
          name, 
          customer_code, 
          address,
          routes!inner(code, name)
        `)
        .or(`routes.code.ilike.${searchTerm},routes.name.ilike.${searchTerm}`)
        .limit(3);

      if (customersByRoute) {
        customersByRoute.forEach(customer => {
          // Only add if not already found
          const exists = results.some(r => r.type === 'customer' && r.id === customer.id);
          if (!exists) {
            results.push({
              id: customer.id,
              type: 'customer',
              title: customer.name,
              subtitle: `Kode: ${customer.customer_code || 'N/A'} | Route: ${(customer.routes as any).code} (${(customer.routes as any).name})`,
              url: `/customers?highlight=${customer.id}`,
            });
          }
        });
      }

      // Search Routes
      const { data: routes } = await supabase
        .from('routes')
        .select(`
          id, 
          code, 
          name,
          sales_agents(name, agent_code)
        `)
        .or(`code.ilike.${searchTerm},name.ilike.${searchTerm}`)
        .limit(5);

      if (routes) {
        routes.forEach(route => {
          results.push({
            id: route.id,
            type: 'route',
            title: route.name,
            subtitle: `Kode: ${route.code}${(route.sales_agents as any)?.agent_code ? ` | Agent: ${(route.sales_agents as any).agent_code}` : ''}`,
            url: `/routes?highlight=${route.id}`,
          });
        });
      }

      // Search routes by assigned sales agent
      const { data: routesByAgent } = await supabase
        .from('routes')
        .select(`
          id, 
          code, 
          name,
          sales_agents!inner(name, agent_code)
        `)
        .or(`sales_agents.agent_code.ilike.${searchTerm},sales_agents.name.ilike.${searchTerm}`)
        .limit(3);

      if (routesByAgent) {
        routesByAgent.forEach(route => {
          // Only add if not already found
          const exists = results.some(r => r.type === 'route' && r.id === route.id);
          if (!exists) {
            results.push({
              id: route.id,
              type: 'route',
              title: route.name,
              subtitle: `Kode: ${route.code} | Agent: ${(route.sales_agents as any).agent_code} (${(route.sales_agents as any).name})`,
              url: `/routes?highlight=${route.id}`,
            });
          }
        });
      }

      // Search Contracts - Primary search from credit_contracts table
      const { data: contracts } = await supabase
        .from('credit_contracts')
        .select(`
          id, 
          contract_ref, 
          product_type,
          customers(name, customer_code)
        `)
        .or(`contract_ref.ilike.${searchTerm},product_type.ilike.${searchTerm}`)
        .limit(5);

      if (contracts) {
        contracts.forEach(contract => {
          if (contract.id) {
            results.push({
              id: contract.id,
              type: 'contract',
              title: contract.contract_ref || 'No Ref',
              subtitle: `${(contract.customers as any)?.name || 'Unknown'} - ${contract.product_type || 'No product'} | Kode: ${(contract.customers as any)?.customer_code || 'N/A'}`,
              url: `/contracts?highlight=${contract.id}`,
            });
          }
        });
      }

      // Search contracts by customer code and name
      const { data: contractsByCustomer } = await supabase
        .from('credit_contracts')
        .select(`
          id, 
          contract_ref, 
          product_type,
          customers!inner(name, customer_code)
        `)
        .or(`customers.name.ilike.${searchTerm},customers.customer_code.ilike.${searchTerm}`)
        .limit(3);

      if (contractsByCustomer) {
        contractsByCustomer.forEach(contract => {
          // Only add if not already found
          const exists = results.some(r => r.type === 'contract' && r.id === contract.id);
          if (!exists && contract.id) {
            results.push({
              id: contract.id,
              type: 'contract',
              title: contract.contract_ref || 'No Ref',
              subtitle: `${(contract.customers as any)?.name || 'Unknown'} - ${contract.product_type || 'No product'} | Kode: ${(contract.customers as any)?.customer_code || 'N/A'}`,
              url: `/contracts?highlight=${contract.id}`,
            });
          }
        });
      }

      // Additional search in invoice_details view for invoices
      const { data: invoices } = await supabase
        .from('invoice_details')
        .select('id, contract_ref, customer_name, product_type, no_faktur')
        .or(`contract_ref.ilike.${searchTerm},customer_name.ilike.${searchTerm},no_faktur.ilike.${searchTerm}`)
        .limit(3);

      if (invoices) {
        invoices.forEach(invoice => {
          // Only add if not already found in contracts search
          const exists = results.some(r => r.type === 'contract' && r.title === invoice.contract_ref);
          if (!exists && invoice.id) {
            results.push({
              id: invoice.id,
              type: 'contract',
              title: invoice.contract_ref || 'No Ref',
              subtitle: `${invoice.customer_name || 'Unknown'} - ${invoice.product_type || 'No product'} (Invoice)`,
              url: `/contracts?highlight=${invoice.id}`,
            });
          }
        });
      }

      return results;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
};
