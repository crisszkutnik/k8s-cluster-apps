package database

import (
	"context"
	"encoding/json"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/env"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type DatabaseService struct {
	conn *pgx.Conn
}

func NewDatabaseService() (*DatabaseService, error) {
	conn, err := pgx.Connect(context.Background(), *env.DB_URL)

	if err != nil {
		return nil, err
	}

	return &DatabaseService{conn: conn}, nil
}

func (s *DatabaseService) GetDestinationsByUserId(userID uuid.UUID) ([]*UserExpenseSave, error) {
	rows, err := s.conn.Query(
		context.Background(),
		"SELECT id, user_id, destination, info, created_date FROM public.user_expense_save WHERE user_id = $1",
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var expenses []*UserExpenseSave
	for rows.Next() {
		expense, err := collectRow(rows)
		if err != nil {
			return nil, err
		}
		expenses = append(expenses, expense)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return expenses, nil
}

func collectRow(row pgx.CollectableRow) (*UserExpenseSave, error) {
	var (
		u       UserExpenseSave
		rawInfo []byte
	)

	err := row.Scan(
		&u.ID,
		&u.UserID,
		&u.Destination,
		&rawInfo,
		&u.CreatedDate,
	)

	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal(rawInfo, &u.Info); err != nil {
		return nil, err
	}

	return &u, nil
}
