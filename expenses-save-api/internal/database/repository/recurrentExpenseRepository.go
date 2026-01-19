package repository

import (
	"context"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type RecurrentExpenseRepository struct {
	db *database.DatabaseService
}

func NewRecurrentExpenseRepository(db *database.DatabaseService) *RecurrentExpenseRepository {
	return &RecurrentExpenseRepository{db: db}
}

func (r *RecurrentExpenseRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]database.RecurrentExpense, error) {
	rows, err := r.db.Query(
		ctx,
		`SELECT id, user_id, description, payment_method_id, ars_amount, usd_amount, category_id, subcategory_id, start_date, end_date, created_date
		FROM public.recurrent_expense
		WHERE user_id = $1
		ORDER BY start_date ASC`,
		userID,
	)
	if err != nil {
		return nil, err
	}

	recurrentExpenses, err := pgx.CollectRows(rows, pgx.RowToStructByName[database.RecurrentExpense])
	if err != nil {
		return nil, err
	}

	return recurrentExpenses, nil
}
