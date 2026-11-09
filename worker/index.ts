import { DurableObject } from 'cloudflare:workers'

interface Env {
  ASSETS: Fetcher
  COUNTER: DurableObjectNamespace<VisitCounter>
}

/** Stores a single number: how many times the site was opened. No visitor data. */
export class VisitCounter extends DurableObject {
  async hit(): Promise<number> {
    const visits = ((await this.ctx.storage.get<number>('visits')) ?? 0) + 1
    await this.ctx.storage.put('visits', visits)
    return visits
  }

  async count(): Promise<number> {
    return (await this.ctx.storage.get<number>('visits')) ?? 0
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/api/visits') {
      const counter = env.COUNTER.get(env.COUNTER.idFromName('site'))
      const visits = request.method === 'POST' ? await counter.hit() : await counter.count()
      return Response.json({ visits }, { headers: { 'cache-control': 'no-store' } })
    }
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
