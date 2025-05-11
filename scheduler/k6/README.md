## RUN k6 online-boutique stress tests

`k6 run --compatibility-mode=experimental_enhanced -e FRONTEND_ADDR=${URL:PORT} k6/online-boutique.ts`