import client from 'prom-client';

const register = new client.Registry();
register.setDefaultLabels({
  name: 'user-service',
});

client.collectDefaultMetrics({ register });

export default register;
