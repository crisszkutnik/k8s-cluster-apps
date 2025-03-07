start:
	go run cmd/lambda-health-checker/main.go

build:
	go build -o dist/lambda-health-checker cmd/lambda-health-checker/main.go

docker:
	docker build . -t ghcr.io/crisszkutnik/lambda-health-checker