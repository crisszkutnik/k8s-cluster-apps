start:
	go run cmd/expenses-save-api/main.go

build:
	go build -o dist/expenses-save-api cmd/expenses-save-api/main.go

proto:
	protoc --go_out=. --go-grpc_out=. proto/Expense.proto

docker:
	docker build . -t ghcr.io/crisszkutnik/expenses-save-api

.PHONY: proto