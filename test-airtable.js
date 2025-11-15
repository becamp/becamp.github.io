#!/usr/bin/env node

import Airtable from 'airtable'
import dotenv from 'dotenv'

dotenv.config()

const AIRTABLE_BASE_ID = 'applbJgB5JNe73ode'
const apiKey = process.env.AIRTABLEKEY

if (!apiKey) {
  console.error('❌ AIRTABLEKEY environment variable is not set')
  process.exit(1)
}

console.log('🔍 Testing Airtable API connection...')
console.log(`📋 Base ID: ${AIRTABLE_BASE_ID}`)
console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`)

try {
  const base = new Airtable({ apiKey }).base(AIRTABLE_BASE_ID)

  // Test 1: Fetch from Sponsors table
  console.log('\n📊 Testing Sponsors table...')
  const sponsorsTable = base('Sponsors')
  const sponsors = await sponsorsTable
    .select({
      fields: ['Sponsor', 'Level'],
      maxRecords: 5,
    })
    .all()

  console.log(`✅ Sponsors table: Found ${sponsors.length} records`)
  if (sponsors.length > 0) {
    console.log(`   First sponsor: ${sponsors[0].fields.Sponsor}`)
  }

  // Test 2: Fetch from Guests table
  console.log('\n👥 Testing Guests table...')
  const guestsTable = base('Guests')
  const guests = await guestsTable
    .select({
      fields: ['Guest Name'],
      maxRecords: 5,
      view: '[be.camp] Attendees Feed',
    })
    .all()

  console.log(`✅ Guests table: Found ${guests.length} records`)
  if (guests.length > 0) {
    console.log(`   First guest: ${guests[0].fields['Guest Name']}`)
  }

  // Test 3: Fetch from Saturday Schedule table
  console.log('\n📅 Testing Saturday Schedule table...')
  const scheduleTable = base('Saturday Schedule')
  const schedule = await scheduleTable
    .select({
      maxRecords: 5,
      view: 'Grid view',
    })
    .all()

  console.log(`✅ Saturday Schedule table: Found ${schedule.length} records`)
  if (schedule.length > 0) {
    const firstRecord = schedule[0].fields
    console.log(`   First record: ${JSON.stringify(firstRecord).substring(0, 100)}...`)
  }

  console.log('\n✅ All Airtable tests passed!')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Airtable API test failed:')
  console.error(`   Error: ${error.message}`)
  if (error.statusCode === 401) {
    console.error('   → Invalid API key. Check AIRTABLEKEY environment variable.')
  } else if (error.statusCode === 404) {
    console.error('   → Base or table not found. Check AIRTABLE_BASE_ID.')
  } else if (error.statusCode === 403) {
    console.error('   → Access denied. Check API key permissions.')
  }
  process.exit(1)
}
