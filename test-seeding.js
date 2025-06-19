const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testSeeding() {
    try {
        console.log('🚀 Starting data seeding test...\n');

        // est seeding all data at once
        console.log('📊 Seeding all data...');
        const allDataResponse = await axios.post(`${BASE_URL}/data/seed/all`);
        console.log('✅ All data seeded successfully!');
        console.log('Summary:', allDataResponse.data.summary);
        console.log('');

        // Test individual seeding endpoints
        console.log('👥 Seeding additional users...');
        const usersResponse = await axios.post(`${BASE_URL}/data/seed/users`);
        console.log(`✅ Created ${usersResponse.data.count} additional users`);
        console.log('');

        console.log('🩸 Seeding donation requests...');
        const requestsResponse = await axios.post(`${BASE_URL}/data/seed/requests`);
        console.log(`✅ Created ${requestsResponse.data.count} donation requests`);
        console.log('');

        console.log('💉 Seeding donations...');
        const donationsResponse = await axios.post(`${BASE_URL}/data/seed/donations`);
        console.log(`✅ Created ${donationsResponse.data.count} donations`);
        console.log('');

        console.log('🎉 All seeding tests completed successfully!');
        
        // Show some sample data
        console.log('\n📋 Sample created data:');
        console.log('Users:', usersResponse.data.users.slice(0, 3));
        console.log('Requests:', requestsResponse.data.requests.slice(0, 3));
        console.log('Donations:', donationsResponse.data.donations.slice(0, 3));

    } catch (error) {
        console.error('❌ Error during seeding test:', error.response?.data || error.message);
    }
}

testSeeding();