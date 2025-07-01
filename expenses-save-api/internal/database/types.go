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

// These are the destinations
type UserExpenseSave struct {
	ID          uuid.UUID              `json:"id"`
	UserID      uuid.UUID              `json:"user_id"`
	Destination DestinationType        `json:"destination"`
	Info        map[string]interface{} `json:"info"`
	CreatedDate time.Time              `json:"created_date"`
}

// This is the actual expense
type Expense struct {
	ID              uuid.UUID  `db:"id"`
	UserID          uuid.UUID  `db:"user_id"`
	Description     string     `db:"description"`
	PaymentMethodID uuid.UUID  `db:"payment_method_id"`
	ARSAmount       float64    `db:"ars_amount"`
	USDAmount       float64    `db:"usd_amount"`
	CategoryID      uuid.UUID  `db:"category_id"`
	SubcategoryID   *uuid.UUID `db:"subcategory_id"`
	Date            time.Time  `db:"date"`
}

type ExpenseSheetsRow struct {
	ID                uuid.UUID `db:"id"`
	Date              time.Time `db:"date"`
	Description       string    `db:"description"`
	PaymentMethodName string    `db:"payment_method_name"`
	ARSAmount         float64   `db:"ars_amount"`
	USDAmount         float64   `db:"usd_amount"`
	CategoryName      string    `db:"category_name"`
	SubcategoryName   *string   `db:"subcategory_name"`
	CreatedDate       time.Time `db:"created_date"`
}

type Category struct {
	Id     uuid.UUID `db:"id"`
	UserID uuid.UUID `db:"user_id"`
	Name   string    `db:"name"`
}

type Subcategory struct {
	Id         uuid.UUID `db:"id"`
	CategoryID uuid.UUID `db:"category_id"`
	Name       string    `db:"name"`
}

type PaymentMethod struct {
	Id     uuid.UUID `db:"id"`
	UserID uuid.UUID `db:"user_id"`
	Name   string    `db:"name"`
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
