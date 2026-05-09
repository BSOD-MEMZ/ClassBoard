export interface AppTool {
  key: string
  name: string
  description: string
  icon: string
  url: string
}

export interface FeedItem {
  title: string
  summary: string
  time: string
}

export interface FeedData {
  title: string
  updatedAt: string
  items: FeedItem[]
}

export interface CityResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}
