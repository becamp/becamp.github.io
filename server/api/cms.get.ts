import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'
import { getCmsSnapshot } from '~/server/utils/cms'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  return await getCmsSnapshot({
    butterKey: config.butterKey,
    airtableKey: config.airtableKey,
  })
})
