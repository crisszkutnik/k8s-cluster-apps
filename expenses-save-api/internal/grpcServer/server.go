package grpcserver

import (
	"context"
	"log"
	"time"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/proto"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/sheets"
	"github.com/google/uuid"
)

type server struct {
	proto.UnimplementedExpensesServer
	sheetsService *sheets.SheetsService
	dbService     *database.DatabaseService
}

func (s *server) AddExpense(_ context.Context, in *proto.NewExpenseRequest) (*proto.ExpenseReply, error) {
	log.Printf("received: %v", in.String())

	userID, err := uuid.Parse(in.UserId)
	if err != nil {
		log.Printf("invalid user ID: %v", err)
		return &proto.ExpenseReply{Success: false, Message: "invalid user ID"}, nil
	}

	saveDestinationRows, err := s.dbService.GetDestinationsByUserId(userID)
	if err != nil {
		log.Printf("failed to get user expenses: %v", err)
		return &proto.ExpenseReply{Success: false, Message: err.Error()}, nil
	}

	/*
		This sucks. Refactor it please

		Right now I am only supporting a single destination place. Ideally this
		should support multiple destinations
	*/
	var sheetsInfo *database.GoogleSheetsInfo
	for _, saveDestination := range saveDestinationRows {
		if saveDestination.Destination == database.DestinationType_GoogleSheets {
			sheetsInfo, err = saveDestination.GetGoogleSheetsInfo()
			if err != nil {
				log.Printf("failed to get Google Sheets info: %v", err)
				continue
			}
			if sheetsInfo != nil {
				break
			}
		}
	}

	if sheetsInfo == nil {
		log.Printf("no Google Sheets configuration found for user %s", userID)
		return &proto.ExpenseReply{Success: false, Message: "no Google Sheets configuration found"}, nil
	}

	timestamp, err := getTimestamp()
	if err != nil {
		log.Printf("failed to get timestamp: %v", err)
		return &proto.ExpenseReply{Success: false, Message: err.Error()}, nil
	}

	row := []interface{}{
		timestamp,
		in.ExpenseInfo.Name,
		in.ExpenseInfo.PaymentMethod,
		in.ExpenseInfo.Amount,
		in.ExpenseInfo.Category,
		in.ExpenseInfo.Subcategory,
		in.ExpenseInfo.Date,
		in.ExpenseInfo.Currency,
	}

	err = s.sheetsService.AppendRow(sheetsInfo.SheetID, sheetsInfo.SheetName, &row)

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
