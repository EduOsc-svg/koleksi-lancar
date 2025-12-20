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
            url: '/sales-agents',
          });
        });
      }

      // Search Customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, address, phone')
        .or(`name.ilike.${searchTerm},address.ilike.${searchTerm},phone.ilike.${searchTerm}`)
        .limit(5);

      if (customers) {
        customers.forEach(customer => {
          results.push({
            id: customer.id,
            type: 'customer',
            title: customer.name,
            subtitle: customer.address || customer.phone || 'No details',
            url: '/customers',
          });
        });
      }

      // Search Routes
      const { data: routes } = await supabase
        .from('routes')
        .select('id, code, name')
        .or(`code.ilike.${searchTerm},name.ilike.${searchTerm}`)
        .limit(5);

      if (routes) {
        routes.forEach(route => {
          results.push({
            id: route.id,
            type: 'route',
            title: route.name,
            subtitle: `Kode: ${route.code}`,
            url: '/routes',
          });
        });
      }

      // Search Contracts via invoice_details view
      const { data: contracts } = await supabase
        .from('invoice_details')
        .select('id, contract_ref, customer_name, product_type, no_faktur')
        .or(`contract_ref.ilike.${searchTerm},customer_name.ilike.${searchTerm},no_faktur.ilike.${searchTerm}`)
        .limit(5);

      if (contracts) {
        contracts.forEach(contract => {
          if (contract.id) {
            results.push({
              id: contract.id,
              type: 'contract',
              title: contract.contract_ref || 'No Ref',
              subtitle: `${contract.customer_name || 'Unknown'} - ${contract.product_type || 'No product'}`,
              url: '/contracts',
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
