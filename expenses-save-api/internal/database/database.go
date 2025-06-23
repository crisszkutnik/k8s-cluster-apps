package database

import (
	"context"
	"encoding/json"
	"log"

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

	if err := conn.Ping(context.Background()); err != nil {
		return nil, err
	}

	log.Print("database connection established")

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

func (s *DatabaseService) GetCategoryByName(userID uuid.UUID, categoryName string) (*Category, error) {
	var category Category

	err := s.conn.QueryRow(
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

	err := s.conn.QueryRow(
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

	err := s.conn.QueryRow(
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

func (s *DatabaseService) InsertExpense(expense *Expense) error {
	_, err := s.conn.Exec(context.Background(), `
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
	`,
		expense.UserID,
		expense.Description,
		expense.PaymentMethodID,
		expense.ARSAmount,
		expense.USDAmount,
		expense.CategoryID,
		expense.SubcategoryID,
		expense.Date,
	)

	return err
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
