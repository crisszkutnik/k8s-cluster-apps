FROM golang:1.24.3-alpine3.20

WORKDIR /app

COPY . /app/
RUN go build -o /app/dist/lambda-health-checker /app/cmd/lambda-health-checker/main.go
RUN go clean -modcache -cache

EXPOSE 3000

CMD ["./dist/lambda-health-checker"]