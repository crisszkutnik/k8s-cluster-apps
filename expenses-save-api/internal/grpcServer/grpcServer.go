package grpcserver

import (
	"log"
	"net"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/env"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/proto"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/sheets"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/validator"
	"google.golang.org/grpc"
)

type GrpcServer struct {
	grpcServer *grpc.Server
	server     *server
}

func NewGrpcServer(sheetsService *sheets.SheetsService, dbService *database.DatabaseService, expenseValidatorService *validator.ExpenseValidatorService) *GrpcServer {
	grpcServer := grpc.NewServer()
	server := &server{sheetsService: sheetsService, dbService: dbService, expenseValidatorService: expenseValidatorService}
	proto.RegisterExpensesServer(grpcServer, server)
	return &GrpcServer{grpcServer: grpcServer, server: server}
}

func (s *GrpcServer) Start() {
	lis, err := net.Listen("tcp", *env.GRPC_PORT)

	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	if err := s.grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
