
import requestStats from 'request-stats'
import { Server } from 'http';
import client from 'prom-client';
import register from '../helpers/MetricsRegistry';

const counter = new client.Counter({
  name: 'http_requests_size',
  help: 'Total traffic in megabytes',
});
register.registerMetric(counter);


const RequestStatsMiddleware = (server: Server) => {
  requestStats(server, stats => {
    counter.inc((stats.req.bytes+stats.res.bytes) / 1024 / 1024)
  })
}

export default RequestStatsMiddleware

