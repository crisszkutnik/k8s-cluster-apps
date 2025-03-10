FROM golang:1.24.0-alpine3.20 AS builder

WORKDIR /app

RUN apk add --no-cache protobuf protobuf-dev

COPY . .

RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

RUN protoc --go_out=. --go-grpc_out=. proto/Expense.proto

RUN go build -o /app/dist/expenses-save-api /app/cmd/expenses-save-api/main.go

RUN go clean -modcache -cache

FROM alpine:3.20

WORKDIR /app

COPY --from=builder /app/dist/expenses-save-api /app/expenses-save-api

EXPOSE 3000

CMD ["./expenses-save-api"]
