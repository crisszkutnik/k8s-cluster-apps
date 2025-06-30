package grpcserver

import (
	"context"
	stdErrors "errors"
	"log"
	"time"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/errors"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/proto"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/sheets"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/validator"
	"github.com/google/uuid"
)

type server struct {
	proto.UnimplementedExpensesServer
	sheetsService           *sheets.SheetsService
	dbService               *database.DatabaseService
	expenseValidatorService *validator.ExpenseValidatorService
}

func (s *server) AddExpense(_ context.Context, in *proto.NewExpenseRequest) (*proto.ExpenseReply, error) {
	log.Printf("received: %v", in.String())

	userID, err := uuid.Parse(in.UserId)
	if err != nil {
		log.Printf("invalid user ID: %v", err)
		return &proto.ExpenseReply{Code: int32(errors.InvalidPayload), Message: "invalid user ID"}, nil
	}

	// Do db stuff

	expense, err := s.expenseValidatorService.GetExpenseFromRequest(userID, in)

	if err != nil {
		log.Printf("failed to get expense from request: %v", err)
		var validationErr *errors.ValidationError

		if stdErrors.As(err, &validationErr) {
			return &proto.ExpenseReply{Code: validationErr.Code, Message: validationErr.Error()}, nil
		}

		return &proto.ExpenseReply{Code: int32(errors.InternalError), Message: err.Error()}, nil
	}

	err = s.dbService.InsertExpense(expense)

	if err != nil {
		log.Printf("failed to insert expense: %v", err)
		return &proto.ExpenseReply{Code: int32(errors.InternalError), Message: err.Error()}, nil
	}

	// Do old stuff. TODO: Refactor it
	saveDestinationRows, err := s.dbService.GetDestinationsByUserId(userID)
	if err != nil {
		log.Printf("failed to get user expenses: %v", err)
		return &proto.ExpenseReply{Code: int32(errors.InternalError), Message: err.Error()}, nil
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
		return &proto.ExpenseReply{Code: int32(errors.InternalError), Message: "no Google Sheets configuration found"}, nil
	}

	timestamp, err := getTimestamp()
	if err != nil {
		log.Printf("failed to get timestamp: %v", err)
		return &proto.ExpenseReply{Code: int32(errors.InternalError), Message: err.Error()}, nil
	}

	row := []interface{}{
		timestamp,
		in.ExpenseInfo.Name,
		in.ExpenseInfo.PaymentMethodName,
		in.ExpenseInfo.Amount,
		in.ExpenseInfo.CategoryName,
		in.ExpenseInfo.SubcategoryName,
		in.ExpenseInfo.Date,
		in.ExpenseInfo.Currency,
	}

	err = s.sheetsService.AppendRow(sheetsInfo.SheetID, sheetsInfo.SheetName, &row)

	if err != nil {
		log.Printf("failed to append row: %v", err)
		return &proto.ExpenseReply{Code: int32(errors.InternalError), Message: err.Error()}, nil
	}

	return &proto.ExpenseReply{Code: int32(errors.Success), Message: "success"}, nil
}

func getTimestamp() (string, error) {
	loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		return "", err
	}

	return time.Now().In(loc).Format("2/1/2006 15:04:05"), nil
}
