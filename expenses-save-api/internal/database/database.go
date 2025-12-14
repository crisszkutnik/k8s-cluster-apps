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

func (s *DatabaseService) InsertExpense(expense *Expense) (uuid.UUID, error) {
	var id uuid.UUID

	err := s.conn.QueryRow(context.Background(), `
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

	err := s.conn.QueryRow(context.Background(), `
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

func (s *DatabaseService) GetExpenses(userID uuid.UUID) ([]*Expense, error) {
	rows, err := s.conn.Query(
		context.Background(),
		`SELECT
			id,
			user_id,
			description,
			payment_method_id,
			ars_amount,
			usd_amount,
			category_id,
			subcategory_id,
			date
		FROM public.expense
		WHERE user_id = $1
		ORDER BY date DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var expenses []*Expense
	for rows.Next() {
		var expense Expense
		err := rows.Scan(
			&expense.ID,
			&expense.UserID,
			&expense.Description,
			&expense.PaymentMethodID,
			&expense.ARSAmount,
			&expense.USDAmount,
			&expense.CategoryID,
			&expense.SubcategoryID,
			&expense.Date,
		)
		if err != nil {
			return nil, err
		}
		expenses = append(expenses, &expense)
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
