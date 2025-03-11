package sheets

import (
	"context"
	"encoding/base64"
	"log"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/env"
	"golang.org/x/oauth2/google"
	"golang.org/x/oauth2/jwt"
	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
)

type SheetsService struct {
	srv *sheets.Service
}

func NewSheetsService() (*SheetsService, error) {
	srv, err := getService()

	if err != nil {
		return nil, err
	}

	return &SheetsService{srv: srv}, nil
}

func (s *SheetsService) AppendRow(row *[]interface{}) error {
	log.Printf("appending row: %v", row)

	_, err := s.srv.Spreadsheets.Values.Append(*env.SPREADSHEET_ID, "Formulario Gastos!A:A", &sheets.ValueRange{
		Values: [][]interface{}{*row},
	}).ValueInputOption("USER_ENTERED").Do()

	if err != nil {
		return err
	}

	log.Println("row appended succesfully")

	return nil
}

func getConfig() (*jwt.Config, error) {
	b, err := base64.StdEncoding.DecodeString(*env.CREDENTIALS_BASE64)

	if err != nil {
		return nil, err
	}

	config, err := google.JWTConfigFromJSON(b, sheets.SpreadsheetsScope)

	if err != nil {
		return nil, err
	}

	return config, nil
}

func getService() (*sheets.Service, error) {
	config, err := getConfig()

	if err != nil {
		return nil, err
	}

	ctx := context.Background()
	client := config.Client(ctx)
	srv, err := sheets.NewService(ctx, option.WithHTTPClient((client)))

	if err != nil {
		return nil, err
	}

	return srv, nil
}
