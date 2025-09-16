# Powerball

A web application to simulate Powerball lottery numbers.

## Getting Started

- Deploy and run: `npm run dev`
- Run Jest tests: `npm test`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Change the server-side storage by adding environment variables `LOTTERY_DATA`.

## Notes

Deployment on Vercel does not support FS operations, thus it cannot store & retrieve lottery data from a file.