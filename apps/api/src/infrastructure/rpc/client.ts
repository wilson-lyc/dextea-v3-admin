import path from 'node:path'
import { credentials, loadPackageDefinition, type ChannelCredentials, type Client } from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { config } from '@/config.js'
import { resolveServiceAddress } from '@/infrastructure/nacos.js'

export type RpcService = 'product' | 'store' | 'trade' | 'xos'

interface RpcDefinition {
  packagePath: string
  serviceName: string
  protoPath: string
}

const definitions: Record<RpcService, RpcDefinition> = {
  product: {
    packagePath: 'dextea.product.v1',
    serviceName: 'ProductService',
    protoPath: path.resolve(process.cwd(), '../../../dextea-proto/proto/product/v1/product.proto'),
  },
  store: {
    packagePath: 'dextea.store.v1',
    serviceName: 'StoreService',
    protoPath: path.resolve(process.cwd(), '../../../dextea-proto/proto/store/v1/store.proto'),
  },
  trade: {
    packagePath: 'dextea.order.v1',
    serviceName: 'OrderService',
    protoPath: path.resolve(process.cwd(), '../../../dextea-proto/proto/order/v1/order.proto'),
  },
  xos: {
    packagePath: 'xos.v1',
    serviceName: 'XOSService',
    protoPath: path.resolve(process.cwd(), '../../../dextea-proto/proto/xos/v1/xos.proto'),
  },
}

function serviceConfig(service: RpcService): { serviceName: string; address: string } {
  switch (service) {
    case 'product': return { serviceName: config.rpc.productServiceName, address: config.rpc.productAddress }
    case 'store': return { serviceName: config.rpc.storeServiceName, address: config.rpc.storeAddress }
    case 'trade': return { serviceName: config.rpc.tradeServiceName, address: config.rpc.tradeAddress }
    case 'xos': return { serviceName: config.rpc.xosServiceName, address: config.rpc.xosAddress }
  }
}

export async function createRpcClient(service: RpcService): Promise<Client> {
  const definition = definitions[service]
  const target = serviceConfig(service)
  const address = config.nacos.enabled
    ? await resolveServiceAddress(target.serviceName, target.address)
    : target.address
  const packageDefinition = protoLoader.loadSync(definition.protoPath, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  })
  const packages = loadPackageDefinition(packageDefinition) as unknown as Record<string, unknown>
  const namespace = packages[service === 'xos' ? 'xos' : 'dextea'] as Record<string, unknown>
  const servicePackage = namespace[service === 'trade' ? 'order' : service] as Record<string, unknown>
  const version = servicePackage.v1 as Record<string, unknown>
  const Service = version[definition.serviceName] as new (
    address: string,
    credentials: ChannelCredentials,
  ) => Client
  return new Service(address, credentials.createInsecure())
}

const clients = new Map<RpcService, Promise<Client>>()

export async function callRpc<TResponse>(
  service: RpcService,
  method: string,
  request: Record<string, unknown>,
): Promise<TResponse> {
  let clientPromise = clients.get(service)
  if (!clientPromise) {
    clientPromise = createRpcClient(service)
    clients.set(service, clientPromise)
  }
  const client = await clientPromise
  const rpcMethod = (client as unknown as Record<string, unknown>)[method] as
    | ((input: Record<string, unknown>, callback: (error: Error | null, response: TResponse) => void) => void)
    | undefined
  if (!rpcMethod) throw new Error(`RPC 方法不存在: ${service}.${method}`)
  return new Promise<TResponse>((resolve, reject) => {
    rpcMethod.call(client, request, (error, response) => error ? reject(error) : resolve(response))
  })
}
