package database

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type DestinationType string

const (
	DestinationType_GoogleSheets DestinationType = "google_sheets"
)

type UserExpenseSave struct {
	ID          uuid.UUID              `json:"id"`
	UserID      uuid.UUID              `json:"user_id"`
	Destination DestinationType        `json:"destination"`
	Info        map[string]interface{} `json:"info"`
	CreatedDate time.Time              `json:"created_date"`
}

type GoogleSheetsInfo struct {
	SheetID   string `json:"sheetId"`
	SheetName string `json:"sheetName"`
}

func (ues *UserExpenseSave) GetGoogleSheetsInfo() (*GoogleSheetsInfo, error) {
	if ues.Destination != DestinationType_GoogleSheets {
		return nil, nil
	}

	sheetID, ok := ues.Info["sheetId"].(string)
	if !ok {
		return nil, fmt.Errorf("sheetId is not a string or is missing")
	}

	sheetName, ok := ues.Info["sheetName"].(string)
	if !ok {
		return nil, fmt.Errorf("sheetName is not a string or is missing")
	}

	return &GoogleSheetsInfo{
		SheetID:   sheetID,
		SheetName: sheetName,
	}, nil
}
