import { useEffect, useRef, useState } from "react"
import { Loader2Icon } from "lucide-react"
import { http } from "@/services/http"

interface Props {
  longitude: number
  latitude: number
  name: string
  address: string
}

let scriptLoaded = false
let scriptLoading: Promise<void> | null = null

function loadAmapScript(key: string, securityCode: string): Promise<void> {
  if (scriptLoaded) return Promise.resolve()
  if (scriptLoading) return scriptLoading

  scriptLoading = new Promise((resolve, reject) => {
    window._AMapSecurityConfig = {
      securityJsCode: securityCode,
    }

    const script = document.createElement("script")
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`
    script.async = true
    script.onload = () => {
      scriptLoaded = true
      resolve()
    }
    script.onerror = () => {
      scriptLoading = null
      reject(new Error("高德地图脚本加载失败"))
    }
    document.head.appendChild(script)
  })

  return scriptLoading
}

export default function AmapMap({ longitude, latitude, name, address }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<AMap.Map | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    let map: AMap.Map | null = null
    let cancelled = false

    ;(async () => {
      try {
        type AmapConfig = { key: string; securityCode: string }
        const res = await http.get<{ code: number; data: AmapConfig }>("/config/amap-key")
        if (cancelled) return

        const { key, securityCode } = res.data.data
        if (!key || !securityCode) {
          setStatus("error")
          return
        }

        await loadAmapScript(key, securityCode)
        if (cancelled || !containerRef.current) return

        map = new AMap.Map(containerRef.current, {
          center: [longitude, latitude],
          zoom: 16,
        })

        const marker = new AMap.Marker({
          position: [longitude, latitude],
          title: name,
        })
        map.add(marker)

        setStatus("ready")
      } catch {
        if (!cancelled) setStatus("error")
      }
    })()

    return () => {
      cancelled = true
      map?.destroy()
    }
  }, [longitude, latitude, name, address])

  return (
    <div className="relative">
      <div ref={containerRef} className="h-60 w-full rounded-lg" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted">
          <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
          地图加载失败
        </div>
      )}
    </div>
  )
}
