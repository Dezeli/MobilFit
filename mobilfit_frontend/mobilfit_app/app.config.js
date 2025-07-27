import 'dotenv/config';

export default {
  expo: {
    name: 'Mobilfit',
    slug: 'DAECOM',
    extra: {
      orsApiKey: process.env.ORS_API_KEY,
      googleApiKey: process.env.GOOGLE_API_KEY,
    },
  },
};
