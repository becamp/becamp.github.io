import Butter from 'buttercms'
import Airtable from 'airtable'
import md5 from 'blueimp-md5'

const AIRTABLE_BASE_ID = 'applbJgB5JNe73ode'

type AirtableAttachment = {
  url: string
  filename?: string
  size?: number
  type?: string
  thumbnails?: Record<string, { url: string }>
}

type AirtableSponsorRecord = {
  Sponsor?: string
  Logo?: AirtableAttachment[]
  Url?: string
  'Write up'?: string
  Level?: string
}

type AirtableAttendeeRecord = {
  'Guest Name'?: string
  'Directory Permission'?: boolean
  Email?: string
}

type AirtableTable = {
  select: (options: Record<string, unknown>) => {
    all: () => Promise<Array<{ fields: Record<string, unknown> }>>
  }
}

type AirtableBase = (tableName: string) => AirtableTable

type CmsSnapshot = {
  pages: Record<string, Record<string, unknown>>
  sponsors: {
    sponsor: string
    logo?: AirtableAttachment[] | null
    url?: string | null
    write_up?: string | null
    level?: string | null
  }[]
  attendees: {
    name: string
    directory_permission: boolean
    key: string
  }[]
  schedule: Record<string, unknown>[]
}

async function fetchButterPages(butterKey?: string | null) {
  const pages: Record<string, Record<string, unknown>> = {}

  if (!butterKey) {
    console.warn('[cms] Missing ButterCMS key – skipping page fetch.')
    return pages
  }

  const butter = Butter(butterKey)
  const slugs = ['homepage', 'faqs', 'schedule', 'history', 'attendees', 'sponsors']

  await Promise.all(
    slugs.map(async (slug) => {
      try {
        const response = await butter.page.retrieve('*', slug)
        const data = response?.data?.data
        if (data?.slug) {
          pages[data.slug] = (data.fields ?? {}) as Record<string, any>
        }
      } catch (error) {
        console.error(`[cms] Failed to load ButterCMS page "${slug}":`, error)
      }
    }),
  )

  return pages
}

async function createAirtableBase(apiKey?: string | null): Promise<AirtableBase | null> {
  const sanitizedKey = (apiKey ?? '').trim()
  if (
    !sanitizedKey ||
    sanitizedKey.toLowerCase() === 'undefined' ||
    sanitizedKey.toLowerCase() === 'null'
  ) {
    console.warn('[cms] Missing Airtable key – skipping Airtable fetch.')
    return null
  }

  const base = new Airtable({ apiKey: sanitizedKey }).base(AIRTABLE_BASE_ID)
  return base as unknown as AirtableBase
}

async function fetchSponsors(base: AirtableBase | null) {
  if (!base) {
    return []
  }

  try {
    const table = base('Sponsors')
    const records = await table
      .select({
        fields: ['Sponsor', 'Logo', 'Url', 'Write up', 'Level'],
        maxRecords: 99,
      })
      .all()

    return records.map((record) => {
      const fields = record.fields as AirtableSponsorRecord
      return {
        sponsor: fields['Sponsor'] ?? '',
        logo: fields['Logo'] ?? null,
        url: fields['Url'] ?? null,
        write_up: fields['Write up'] ?? null,
        level: fields['Level'] ?? null,
      }
    })
  } catch (error) {
    console.error('[cms] Failed to load sponsors from Airtable:', error)
    return []
  }
}

async function fetchAttendees(base: AirtableBase | null) {
  if (!base) {
    return []
  }

  try {
    const table = base('Guests')
    const records = await table
      .select({
        fields: ['Guest Name', 'Directory Permission', 'Email'],
        maxRecords: 999,
        view: '[be.camp] Attendees Feed',
      })
      .all()

    return records.map((record) => {
      const fields = record.fields as AirtableAttendeeRecord
      const permission = Boolean(fields['Directory Permission'])
      const email = fields.Email?.trim().toLowerCase()
      return {
        name: fields['Guest Name'] ?? '',
        directory_permission: permission,
        key: permission && email ? md5(email) : '',
      }
    })
  } catch (error) {
    console.error('[cms] Failed to load attendees from Airtable:', error)
    return []
  }
}

async function fetchSchedule(base: AirtableBase | null) {
  if (!base) {
    return []
  }

  try {
    const table = base('Saturday Schedule')
    const records = await table
      .select({
        maxRecords: 999,
        view: 'Grid view',
      })
      .all()

    return records.map((record) => {
      const fields = record.fields as Record<string, unknown>
      return { ...fields }
    })
  } catch (error) {
    console.error('[cms] Failed to load schedule from Airtable:', error)
    return []
  }
}

let cachedSnapshot: CmsSnapshot | null = null

export async function getCmsSnapshot(runtimeConfig: {
  butterKey?: string
  airtableKey?: string
}): Promise<CmsSnapshot> {
  if (cachedSnapshot) {
    return cachedSnapshot
  }

  const [pages, base] = await Promise.all([
    fetchButterPages(runtimeConfig.butterKey),
    createAirtableBase(runtimeConfig.airtableKey),
  ])

  const [sponsors, attendees, schedule] = await Promise.all([
    fetchSponsors(base),
    fetchAttendees(base),
    fetchSchedule(base),
  ])

  cachedSnapshot = {
    pages,
    sponsors,
    attendees,
    schedule,
  }

  return cachedSnapshot
}
