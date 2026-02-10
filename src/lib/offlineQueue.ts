import { supabase } from '@/integrations/supabase/client';

export interface QueuedOperation {
  id: string;
  type: 'payment' | 'bulk_payment';
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}

const QUEUE_KEY = 'offline_queue';
const MAX_RETRIES = 3;

// --- Storage helpers ---

function getQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedOperation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// --- Public API ---

export function addToQueue(type: QueuedOperation['type'], payload: Record<string, unknown>) {
  const queue = getQueue();
  const op: QueuedOperation = {
    id: crypto.randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
    retries: 0,
    status: 'pending',
  };
  queue.push(op);
  saveQueue(queue);
  return op;
}

export function getPendingQueue(): QueuedOperation[] {
  return getQueue().filter(op => op.status !== 'processing');
}

export function getQueueCount(): number {
  return getQueue().filter(op => op.status === 'pending' || op.status === 'failed').length;
}

export function clearCompletedFromQueue() {
  // Only keep pending/failed items
  const queue = getQueue().filter(op => op.status === 'pending' || op.status === 'failed');
  saveQueue(queue);
}

export function removeFromQueue(id: string) {
  saveQueue(getQueue().filter(op => op.id !== id));
}

// --- Sync logic ---

async function processPayment(payload: Record<string, unknown>) {
  const { data: paymentData, error: paymentError } = await supabase
    .from('payment_logs')
    .insert({
      contract_id: payload.contract_id as string,
      payment_date: payload.payment_date as string,
      installment_index: payload.installment_index as number,
      amount_paid: payload.amount_paid as number,
      collector_id: payload.collector_id as string | null,
      notes: payload.notes as string | null,
    })
    .select()
    .single();
  if (paymentError) throw paymentError;

  const { error: updateError } = await supabase
    .from('credit_contracts')
    .update({ current_installment_index: payload.installment_index as number })
    .eq('id', payload.contract_id as string);
  if (updateError) throw updateError;

  return paymentData;
}

async function processBulkPayment(payload: Record<string, unknown>) {
  const startIndex = payload.start_index as number;
  const couponCount = payload.coupon_count as number;
  const endIndex = startIndex + couponCount - 1;
  const amountPerCoupon = payload.amount_per_coupon as number;

  const payments = [];
  for (let i = startIndex; i <= endIndex; i++) {
    payments.push({
      contract_id: payload.contract_id as string,
      payment_date: payload.payment_date as string,
      installment_index: i,
      amount_paid: amountPerCoupon,
      collector_id: payload.collector_id as string | null,
      notes: (payload.notes as string) || `Pembayaran ke-${i}`,
    });
  }

  const { error: paymentError } = await supabase
    .from('payment_logs')
    .insert(payments);
  if (paymentError) throw paymentError;

  const { error: couponError } = await supabase
    .from('installment_coupons')
    .update({ status: 'paid' })
    .eq('contract_id', payload.contract_id as string)
    .gte('installment_index', startIndex)
    .lte('installment_index', endIndex);
  if (couponError) throw couponError;

  const { error: updateError } = await supabase
    .from('credit_contracts')
    .update({ current_installment_index: endIndex })
    .eq('id', payload.contract_id as string);
  if (updateError) throw updateError;
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getQueue();
  const pending = queue.filter(op => op.status === 'pending' || op.status === 'failed');
  
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const op of pending) {
    op.status = 'processing';
    saveQueue(queue);

    try {
      if (op.type === 'payment') {
        await processPayment(op.payload);
      } else if (op.type === 'bulk_payment') {
        await processBulkPayment(op.payload);
      }
      // Success — remove from queue
      const updated = getQueue().filter(q => q.id !== op.id);
      saveQueue(updated);
      synced++;
    } catch (err: unknown) {
      op.retries++;
      op.status = op.retries >= MAX_RETRIES ? 'failed' : 'pending';
      op.error = err instanceof Error ? err.message : 'Unknown error';
      saveQueue(getQueue().map(q => q.id === op.id ? op : q));
      failed++;
    }
  }

  return { synced, failed };
}
