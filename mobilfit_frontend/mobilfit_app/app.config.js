import 'dotenv/config';

export default {
  expo: {
    name: 'YourAppName',
    slug: 'your-app-slug',
    // 생략...
    extra: {
      orsApiKey: process.env.ORS_API_KEY,
    },
  },
};
