-- Fix: Assign sales_agent_id to all contracts based on customer's assigned_sales_id
-- First, let's update contracts to link them with sales agents

-- Update contracts to use the customer's assigned sales agent
UPDATE credit_contracts cc
SET sales_agent_id = c.assigned_sales_id
FROM customers c
WHERE cc.customer_id = c.id
AND cc.sales_agent_id IS NULL
AND c.assigned_sales_id IS NOT NULL;

-- For any remaining contracts without sales_agent_id, distribute evenly across agents
WITH numbered_contracts AS (
  SELECT 
    cc.id as contract_id,
    ROW_NUMBER() OVER (ORDER BY cc.created_at) as rn
  FROM credit_contracts cc
  WHERE cc.sales_agent_id IS NULL
),
numbered_agents AS (
  SELECT 
    id as agent_id,
    ROW_NUMBER() OVER (ORDER BY agent_code) as agent_num
  FROM sales_agents
)
UPDATE credit_contracts
SET sales_agent_id = (
  SELECT agent_id 
  FROM numbered_agents 
  WHERE agent_num = ((
    SELECT rn FROM numbered_contracts WHERE contract_id = credit_contracts.id
  ) - 1) % (SELECT COUNT(*) FROM sales_agents) + 1
)
WHERE sales_agent_id IS NULL;

-- Also update customers that don't have assigned_sales_id
WITH numbered_customers AS (
  SELECT 
    id as customer_id,
    ROW_NUMBER() OVER (ORDER BY customer_code) as rn
  FROM customers
  WHERE assigned_sales_id IS NULL
),
numbered_agents AS (
  SELECT 
    id as agent_id,
    ROW_NUMBER() OVER (ORDER BY agent_code) as agent_num
  FROM sales_agents
)
UPDATE customers
SET assigned_sales_id = (
  SELECT agent_id 
  FROM numbered_agents 
  WHERE agent_num = ((
    SELECT rn FROM numbered_customers WHERE customer_id = customers.id
  ) - 1) % (SELECT COUNT(*) FROM sales_agents) + 1
)
WHERE assigned_sales_id IS NULL;

-- Verify the fix
SELECT 
  'Contracts with sales_agent' as metric,
  COUNT(*) FILTER (WHERE sales_agent_id IS NOT NULL) as with_agent,
  COUNT(*) FILTER (WHERE sales_agent_id IS NULL) as without_agent,
  COUNT(*) as total
FROM credit_contracts;