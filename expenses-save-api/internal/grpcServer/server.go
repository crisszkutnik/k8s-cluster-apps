package grpcserver

import (
	"context"
	"log"
	"time"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/proto"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/sheets"
)

type server struct {
	proto.UnimplementedExpensesServer
	sheetsService *sheets.SheetsService
}

func (s *server) AddExpense(_ context.Context, in *proto.NewExpenseRequest) (*proto.ExpenseReply, error) {
	log.Printf("received: %v", in.String())

	timestamp, err := getTimestamp()

	if err != nil {
		log.Printf("failed to get timestamp: %v", err)
		return &proto.ExpenseReply{Success: false, Message: err.Error()}, nil
	}

	row := []interface{}{
		timestamp,
		in.Name,
		in.PaymentMethod,
		in.Amount,
		in.Category,
		in.Subcategory,
		in.Date,
		in.Currency,
	}

	err = s.sheetsService.AppendRow(&row)

	if err != nil {
		log.Printf("failed to append row: %v", err)
		return &proto.ExpenseReply{Success: false, Message: err.Error()}, nil
	}

	return &proto.ExpenseReply{Success: true, Message: "Row saved"}, nil
}

func getTimestamp() (string, error) {
	loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		return "", err
	}

	return time.Now().In(loc).Format("2/1/2006 15:04:05"), nil
}
