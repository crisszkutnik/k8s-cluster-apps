package expense

import (
	"context"
	"fmt"
	"time"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database/repository"
	"github.com/google/uuid"
)

type ExpenseService struct {
	categoryRepo         *repository.CategoryRepository
	subcategoryRepo      *repository.SubcategoryRepository
	paymentMethodRepo    *repository.PaymentMethodRepository
	recurrentExpenseRepo *repository.RecurrentExpenseRepository
	expenseRepo          *repository.ExpenseRepository
}

type ExpenseInsertInformationResponse struct {
	Categories        []database.Category         `json:"categories"`
	Subcategories     []database.Subcategory      `json:"subcategories"`
	PaymentMethods    []database.PaymentMethod    `json:"paymentMethods"`
	RecurrentExpenses []database.RecurrentExpense `json:"recurrentExpenses"`
}

type ExpensePayload struct {
	Description        string  `json:"description" validate:"required"`
	PaymentMethodID    string  `json:"paymentMethodId" validate:"required,uuid"`
	ArsAmount          float64 `json:"arsAmount" validate:"required,min=0"`
	UsdAmount          float64 `json:"usdAmount" validate:"required,min=0"`
	CategoryID         string  `json:"categoryId" validate:"required,uuid"`
	SubcategoryID      *string `json:"subcategoryId" validate:"omitempty,uuid"`
	RecurrentExpenseID *string `json:"recurrentExpenseId" validate:"omitempty,uuid"`
	Date               string  `json:"date" validate:"required,datetime=2006-01-02"`
}

// ExpenseWithStringIDs is an internal representation used between controller and service
type ExpenseWithStringIDs struct {
	UserID          uuid.UUID
	Description     string
	PaymentMethodID string
	ARSAmount       float64
	USDAmount       float64
	CategoryID      string
	SubcategoryID   *string
	Date            time.Time
}

func NewExpenseService(
	categoryRepo *repository.CategoryRepository,
	subcategoryRepo *repository.SubcategoryRepository,
	paymentMethodRepo *repository.PaymentMethodRepository,
	recurrentExpenseRepo *repository.RecurrentExpenseRepository,
	expenseRepo *repository.ExpenseRepository,
) *ExpenseService {
	return &ExpenseService{
		categoryRepo:         categoryRepo,
		subcategoryRepo:      subcategoryRepo,
		paymentMethodRepo:    paymentMethodRepo,
		recurrentExpenseRepo: recurrentExpenseRepo,
		expenseRepo:          expenseRepo,
	}
}

func (s *ExpenseService) GetExpenseInsertInformation(
	ctx context.Context,
	userId uuid.UUID,
	withRecurrentExpense bool,
) (*ExpenseInsertInformationResponse, error) {
	paymentMethods, err := s.paymentMethodRepo.GetByUserID(ctx, userId)

	if err != nil {
		return nil, err
	}

	categories, err := s.categoryRepo.GetByUserID(ctx, userId)

	if err != nil {
		return nil, err
	}

	subcategories, err := s.subcategoryRepo.GetByUserID(ctx, userId)

	if err != nil {
		return nil, err
	}

	var recurrentExpenses []database.RecurrentExpense

	if withRecurrentExpense {
		recurrentExpenses, err = s.recurrentExpenseRepo.GetByUserID(ctx, userId)

		if err != nil {
			return nil, err
		}
	}

	return &ExpenseInsertInformationResponse{
		PaymentMethods:    paymentMethods,
		Categories:        categories,
		Subcategories:     subcategories,
		RecurrentExpenses: recurrentExpenses,
	}, nil
}

func (s *ExpenseService) AddExpense(ctx context.Context, userID uuid.UUID, payload *ExpensePayload) (*database.Expense, error) {
	buenosAiresLoc, _ := time.LoadLocation("America/Argentina/Buenos_Aires")
	expenseDate, _ := time.ParseInLocation("2006-01-02", payload.Date, buenosAiresLoc)

	expense, err := s.expenseRepo.InsertFromStrings(
		ctx,
		userID,
		payload.Description,
		payload.PaymentMethodID,
		payload.ArsAmount,
		payload.UsdAmount,
		payload.CategoryID,
		payload.SubcategoryID,
		payload.RecurrentExpenseID,
		expenseDate,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert expense: %w", err)
	}

	return expense, nil
}

func (s *ExpenseService) GetExpenses(ctx context.Context, userID uuid.UUID, startDateStr string, endDateStr string) ([]database.Expense, error) {
	buenosAiresLoc, _ := time.LoadLocation("America/Argentina/Buenos_Aires")

	startDate, err := time.ParseInLocation("2006-01-02", startDateStr, buenosAiresLoc)
	if err != nil {
		return nil, fmt.Errorf("invalid startDate format, expected YYYY-MM-DD: %w", err)
	}

	endDate, err := time.ParseInLocation("2006-01-02", endDateStr, buenosAiresLoc)
	if err != nil {
		return nil, fmt.Errorf("invalid endDate format, expected YYYY-MM-DD: %w", err)
	}

	if startDate.After(endDate) {
		return nil, fmt.Errorf("startDate cannot be after endDate")
	}

	expenses, err := s.expenseRepo.GetByUserIDAndDateRange(ctx, userID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch expenses: %w", err)
	}

	return expenses, nil
}
