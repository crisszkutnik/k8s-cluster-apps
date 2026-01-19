package database

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/env"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DatabaseService struct {
	pool *pgxpool.Pool
}

func NewDatabaseService() (*DatabaseService, error) {
	config, err := pgxpool.ParseConfig(*env.DB_URL)
	if err != nil {
		return nil, err
	}

	config.MaxConns = 3
	config.MinConns = 1
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 5 * time.Minute
	config.HealthCheckPeriod = 1 * time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, err
	}

	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		return nil, err
	}

	log.Print("database connection pool established")

	return &DatabaseService{pool: pool}, nil
}

func (s *DatabaseService) QueryRow(ctx context.Context, sql string, args ...interface{}) pgx.Row {
	return s.pool.QueryRow(ctx, sql, args...)
}

func (s *DatabaseService) Query(ctx context.Context, sql string, args ...interface{}) (pgx.Rows, error) {
	return s.pool.Query(ctx, sql, args...)
}

func (s *DatabaseService) Exec(ctx context.Context, sql string, args ...interface{}) error {
	_, err := s.pool.Exec(ctx, sql, args...)
	return err
}

// ============================================================================
// Legacy Methods (kept for backward compatibility)
// ============================================================================

func (s *DatabaseService) GetDestinationsByUserId(userID uuid.UUID) ([]*UserExpenseSave, error) {
	rows, err := s.pool.Query(
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

func (s *DatabaseService) GetCategoryByName(userID uuid.UUID, categoryName string) (*Category, error) {
	var category Category

	err := s.pool.QueryRow(
		context.Background(),
		"SELECT id, user_id, name FROM public.category WHERE user_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1",
		userID,
		categoryName,
	).Scan(&category.Id, &category.UserID, &category.Name)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &category, nil
}

func (s *DatabaseService) GetSubcategoryByName(categoryID uuid.UUID, subcategoryName string) (*Subcategory, error) {
	var subcategory Subcategory

	err := s.pool.QueryRow(
		context.Background(),
		"SELECT id, category_id, name FROM public.subcategory WHERE category_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1",
		categoryID,
		subcategoryName,
	).Scan(&subcategory.Id, &subcategory.CategoryID, &subcategory.Name)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &subcategory, nil
}

func (s *DatabaseService) GetPaymentMethodByName(userID uuid.UUID, paymentMethodName string) (*PaymentMethod, error) {
	var paymentMethod PaymentMethod

	err := s.pool.QueryRow(
		context.Background(),
		"SELECT id, user_id, name FROM public.payment_method WHERE user_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1",
		userID,
		paymentMethodName,
	).Scan(&paymentMethod.Id, &paymentMethod.UserID, &paymentMethod.Name)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &paymentMethod, nil
}

// Deprecated: Use ExpenseRepository.Insert instead
func (s *DatabaseService) InsertExpense(expense *Expense) (uuid.UUID, error) {
	var id uuid.UUID

	err := s.pool.QueryRow(context.Background(), `
		INSERT INTO public.expense (
			user_id,
			description,
			payment_method_id,
			ars_amount,
			usd_amount,
			category_id,
			subcategory_id,
			date
		) VALUES
		($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`,
		expense.UserID,
		expense.Description,
		expense.PaymentMethodID,
		expense.ARSAmount,
		expense.USDAmount,
		expense.CategoryID,
		expense.SubcategoryID,
		expense.Date,
	).Scan(&id)

	return id, err
}

func (s *DatabaseService) RetrieveExpenseForSheets(expenseID uuid.UUID) (*ExpenseSheetsRow, error) {
	var expense ExpenseSheetsRow

	err := s.pool.QueryRow(context.Background(), `
		SELECT
			e.id,
			e.date,
			e.description,
			pm.name AS payment_method_name,
			e.ars_amount,
			e.usd_amount,
			c.name AS category_name,
			sc.name AS subcategory_name,
			e.created_date
		FROM expense e
		JOIN payment_method pm ON pm.id = e.payment_method_id
		JOIN category c ON c.id = e.category_id
		LEFT JOIN subcategory sc ON sc.id = e.subcategory_id
		WHERE e.id = $1
		LIMIT 1;
	`, expenseID).Scan(
		&expense.ID,
		&expense.Date,
		&expense.Description,
		&expense.PaymentMethodName,
		&expense.ARSAmount,
		&expense.USDAmount,
		&expense.CategoryName,
		&expense.SubcategoryName,
		&expense.CreatedDate,
	)

	if err != nil {
		return nil, err
	}

	return &expense, nil
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

func (s *DatabaseService) Close() {
	s.pool.Close()
}
