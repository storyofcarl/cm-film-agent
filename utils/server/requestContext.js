import { AsyncLocalStorage } from 'node:async_hooks';

const requests = new AsyncLocalStorage();
export const runWithRequest = (context, operation) => requests.run(context, operation);
export const requestContext = () => {
  const context = requests.getStore();
  if (!context?.user?.id) throw new Error('Authenticated request context required');
  return context;
};
