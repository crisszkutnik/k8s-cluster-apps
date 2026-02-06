package repository

import (
	"context"
	"time"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type ExpenseRepository struct {
	db *database.DatabaseService
}

func NewExpenseRepository(db *database.DatabaseService) *ExpenseRepository {
	return &ExpenseRepository{db: db}
}

func (r *ExpenseRepository) GetByUserIDAndDateRange(ctx context.Context, userID uuid.UUID, startDate time.Time, endDate time.Time) ([]database.Expense, error) {
	startOfDay := time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, startDate.Location())

	endOfDay := time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, endDate.Location())

	/*
		TODO: Make something with the USD amount being NaN
	*/
	rows, err := r.db.Query(
		ctx,
		`SELECT 
			id, 
			user_id, 
			description, 
			payment_method_id,
			ars_amount,
			CASE 
				WHEN usd_amount = 'NaN' THEN 0 
				ELSE usd_amount
			END as usd_amount,
			category_id, 
			subcategory_id,
			recurrent_expense_id,
			installements_expense_id,
			date 
		FROM public.expense 
		WHERE user_id = $1 
			AND date >= $2 
			AND date <= $3 
		ORDER BY date DESC`,
		userID,
		startOfDay,
		endOfDay,
	)
	if err != nil {
		return nil, err
	}

	expenses, err := pgx.CollectRows(rows, pgx.RowToStructByName[database.Expense])
	if err != nil {
		return nil, err
	}

	return expenses, nil
}

func (r *ExpenseRepository) InsertFromStrings(ctx context.Context, userID uuid.UUID, description string, paymentMethodID string, arsAmount float64, usdAmount float64, categoryID string, subcategoryID *string, recurrentExpenseID *string, date time.Time) (*database.Expense, error) {
	paymentMethodUUID := uuid.MustParse(paymentMethodID)
	categoryUUID := uuid.MustParse(categoryID)

	var subcategoryUUID *uuid.UUID
	if subcategoryID != nil {
		parsed := uuid.MustParse(*subcategoryID)
		subcategoryUUID = &parsed
	}

	var recurrentExpenseUUID *uuid.UUID
	if recurrentExpenseID != nil {
		parsed := uuid.MustParse(*recurrentExpenseID)
		recurrentExpenseUUID = &parsed
	}

	expense := &database.Expense{
		UserID:          userID,
		Description:     description,
		PaymentMethodID: paymentMethodUUID,
		ARSAmount:       arsAmount,
		USDAmount:       usdAmount,
		CategoryID:      categoryUUID,
		SubcategoryID:   subcategoryUUID,
		Date:            date,
	}

	// Insert and get ID
	id, err := r.Insert(ctx, expense, recurrentExpenseUUID)
	if err != nil {
		return nil, err
	}

	expense.ID = id
	return expense, nil
}

func (r *ExpenseRepository) Insert(ctx context.Context, expense *database.Expense, recurrentExpenseID *uuid.UUID) (uuid.UUID, error) {
	var id uuid.UUID

	err := r.db.QueryRow(ctx, `
		INSERT INTO public.expense (
			user_id,
			description,
			payment_method_id,
			ars_amount,
			usd_amount,
			category_id,
			subcategory_id,
			recurrent_expense_id,
			date
		) VALUES
		($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`,
		expense.UserID,
		expense.Description,
		expense.PaymentMethodID,
		expense.ARSAmount,
		expense.USDAmount,
		expense.CategoryID,
		expense.SubcategoryID,
		recurrentExpenseID,
		expense.Date,
	).Scan(&id)

	return id, err
}

func (r *ExpenseRepository) GetByID(ctx context.Context, expenseID uuid.UUID, userID uuid.UUID) (*database.Expense, error) {
	row, err := r.db.Query(
		ctx,
		`SELECT 
			id, 
			user_id, 
			description, 
			payment_method_id,
			ars_amount,
			CASE 
				WHEN usd_amount = 'NaN' THEN 0 
				ELSE usd_amount
			END as usd_amount,
			category_id, 
			subcategory_id,
			recurrent_expense_id,
			installements_expense_id,
			date 
		FROM public.expense 
		WHERE id = $1 AND user_id = $2`,
		expenseID,
		userID,
	)
	if err != nil {
		return nil, err
	}

	expenses, err := pgx.CollectRows(row, pgx.RowToStructByName[database.Expense])
	if err != nil {
		return nil, err
	}

	if len(expenses) == 0 {
		return nil, pgx.ErrNoRows
	}

	return &expenses[0], nil
}

func (r *ExpenseRepository) Update(ctx context.Context, expenseID uuid.UUID, userID uuid.UUID, description string, paymentMethodID string, arsAmount float64, usdAmount float64, categoryID string, subcategoryID *string, recurrentExpenseID *string, date time.Time) (*database.Expense, error) {
	paymentMethodUUID := uuid.MustParse(paymentMethodID)
	categoryUUID := uuid.MustParse(categoryID)

	var subcategoryUUID *uuid.UUID
	if subcategoryID != nil {
		parsed := uuid.MustParse(*subcategoryID)
		subcategoryUUID = &parsed
	}

	var recurrentExpenseUUID *uuid.UUID
	if recurrentExpenseID != nil {
		parsed := uuid.MustParse(*recurrentExpenseID)
		recurrentExpenseUUID = &parsed
	}

	err := r.db.Exec(ctx, `
		UPDATE public.expense 
		SET 
			description = $1,
			payment_method_id = $2,
			ars_amount = $3,
			usd_amount = $4,
			category_id = $5,
			subcategory_id = $6,
			recurrent_expense_id = $7,
			date = $8
		WHERE id = $9 AND user_id = $10
	`,
		description,
		paymentMethodUUID,
		arsAmount,
		usdAmount,
		categoryUUID,
		subcategoryUUID,
		recurrentExpenseUUID,
		date,
		expenseID,
		userID,
	)

	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, expenseID, userID)
}

func (r *ExpenseRepository) Delete(ctx context.Context, expenseID uuid.UUID, userID uuid.UUID) error {
	_, err := r.GetByID(ctx, expenseID, userID)
	if err != nil {
		return err
	}

	err = r.db.Exec(ctx, `
		DELETE FROM public.expense 
		WHERE id = $1 AND user_id = $2
	`,
		expenseID,
		userID,
	)

	return err
}
