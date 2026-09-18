import { config } from '@/config.js'

interface NacosClient { ready(): Promise<void>; selectInstances(serviceName: string): Promise<Array<{ ip: string; port: number; weight: number }>>; close(): Promise<void> }
let client: NacosClient | undefined

export async function getNacosClient(): Promise<NacosClient | undefined> {
  if (!config.nacos.enabled) return undefined
  if (!client) {
    if (config.nacos.serverList.length === 0) throw new Error('NACOS_SERVER_ADDR 未配置')
    client = new HttpNacosClient()
    await client.ready()
  }
  return client
}

export async function resolveServiceAddress(serviceName: string, fallback: string): Promise<string> {
  try {
    const naming = await getNacosClient()
    if (!naming) return fallback
    const hosts = await naming.selectInstances(serviceName)
    const healthy = hosts.filter((host) => host.weight > 0)
    const selected = healthy[Math.floor(Math.random() * healthy.length)]
    return selected ? `${selected.ip}:${selected.port}` : fallback
  } catch {
    return fallback
  }
}

class HttpNacosClient implements NacosClient {
  private get endpoint(): string {
    return `http://${config.nacos.serverList[0]}`
  }
  async ready(): Promise<void> {
    const response = await fetch(`${this.endpoint}/nacos/v1/ns/operator/metrics`)
    if (!response.ok) throw new Error(`Nacos 连接失败: HTTP ${response.status}`)
  }
  async selectInstances(serviceName: string): Promise<Array<{ ip: string; port: number; weight: number }>> {
    const params = new URLSearchParams({ serviceName, groupName: config.nacos.group, namespaceId: config.nacos.namespace, healthyOnly: 'true' })
    if (config.nacos.username) params.set('username', config.nacos.username)
    if (config.nacos.password) params.set('password', config.nacos.password)
    const response = await fetch(`${this.endpoint}/nacos/v1/ns/instance/list?${params}`)
    if (!response.ok) throw new Error(`Nacos 查询失败: HTTP ${response.status}`)
    const body = await response.json() as { hosts?: Array<{ ip: string; port: number; weight: number }> }
    return body.hosts ?? []
  }
  async close(): Promise<void> {}
}

export async function closeNacosClient(): Promise<void> {
  await client?.close()
  client = undefined
}
