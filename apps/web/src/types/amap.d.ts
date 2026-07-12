interface Window {
  _AMapSecurityConfig?: {
    securityJsCode: string
  }
}

declare namespace AMap {
  class Map {
    constructor(container: HTMLElement, opts?: MapOptions)
    destroy(): void
    add(obj: Marker): void
    on(
      eventName: string,
      handler: (event: { lnglat: { getLng(): number; getLat(): number } }) => void,
    ): void
  }

  interface MapOptions {
    center: [number, number]
    zoom: number
    layers?: Layer[]
  }

  interface Layer {}

  class TileLayer {
    static Satellite: new () => Layer
  }

  class Marker {
    constructor(opts: MarkerOptions)
    setPosition(position: [number, number]): void
  }

  interface MarkerOptions {
    position: [number, number]
    title?: string
  }

  class InfoWindow {
    constructor(opts: InfoWindowOptions)
    open(map: Map, position: [number, number]): void
  }

  interface InfoWindowOptions {
    content: string
    offset: Pixel
  }

  class Pixel {
    constructor(x: number, y: number)
  }
}
