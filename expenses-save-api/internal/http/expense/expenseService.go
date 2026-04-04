package expense

import (
	"context"
	"fmt"
	"time"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database/repository"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/dollar"
	"github.com/google/uuid"
)

type ExpenseService struct {
	categoryRepo            *repository.CategoryRepository
	subcategoryRepo         *repository.SubcategoryRepository
	paymentMethodRepo       *repository.PaymentMethodRepository
	recurrentExpenseRepo    *repository.RecurrentExpenseRepository
	expenseRepo             *repository.ExpenseRepository
	installmentExpenseRepo  *repository.InstallmentExpenseRepository
	dollarService           *dollar.DollarService
	db                      *database.DatabaseService
}

type ExpenseInsertInformationResponse struct {
	Categories        []database.Category         `json:"categories"`
	Subcategories     []database.Subcategory      `json:"subcategories"`
	PaymentMethods    []database.PaymentMethod    `json:"paymentMethods"`
	RecurrentExpenses []database.RecurrentExpense `json:"recurrentExpenses"`
	UsdArsFx          float64                     `json:"usdArsFx"`
}

type ExpensePayload struct {
	Description        string  `json:"description" validate:"required"`
	PaymentMethodID    string  `json:"paymentMethodId" validate:"required,uuid"`
	ArsAmount          float64 `json:"arsAmount" validate:"required,min=0"`
	UsdAmount          float64 `json:"usdAmount" validate:"required,min=0"`
	CategoryID         string  `json:"categoryId" validate:"required,uuid"`
	SubcategoryID      *string `json:"subcategoryId,omitempty" validate:"omitempty,uuid"`
	RecurrentExpenseID *string `json:"recurrentExpenseId,omitempty" validate:"omitempty,uuid"`
	Date               string  `json:"date" validate:"required,datetime=2006-01-02"`
	InstallmentMonths  int     `json:"installmentMonths,omitempty" validate:"omitempty,min=1"`
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
	installmentExpenseRepo *repository.InstallmentExpenseRepository,
	dollarService *dollar.DollarService,
	db *database.DatabaseService,
) *ExpenseService {
	return &ExpenseService{
		categoryRepo:           categoryRepo,
		subcategoryRepo:        subcategoryRepo,
		paymentMethodRepo:      paymentMethodRepo,
		recurrentExpenseRepo:   recurrentExpenseRepo,
		expenseRepo:            expenseRepo,
		installmentExpenseRepo: installmentExpenseRepo,
		dollarService:          dollarService,
		db:                     db,
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

	usdArsFx, err := s.dollarService.GetExchangeRate()

	if err != nil {
		return nil, err
	}

	return &ExpenseInsertInformationResponse{
		PaymentMethods:    paymentMethods,
		Categories:        categories,
		Subcategories:     subcategories,
		RecurrentExpenses: recurrentExpenses,
		UsdArsFx:          usdArsFx,
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

func (s *ExpenseService) GetExpenses(ctx context.Context, userID uuid.UUID, startDateStr string, endDateStr string, categoryID *uuid.UUID, subcategoryID *uuid.UUID) ([]database.Expense, error) {
	buenosAiresLoc, _ := time.LoadLocation("America/Argentina/Buenos_Aires")

	var startDate *time.Time
	if startDateStr != "" {
		t, err := time.ParseInLocation("2006-01-02", startDateStr, buenosAiresLoc)
		if err != nil {
			return nil, fmt.Errorf("invalid startDate format, expected YYYY-MM-DD: %w", err)
		}
		startDate = &t
	}

	var endDate *time.Time
	if endDateStr != "" {
		t, err := time.ParseInLocation("2006-01-02", endDateStr, buenosAiresLoc)
		if err != nil {
			return nil, fmt.Errorf("invalid endDate format, expected YYYY-MM-DD: %w", err)
		}
		endDate = &t
	}

	if startDate != nil && endDate != nil && startDate.After(*endDate) {
		return nil, fmt.Errorf("startDate cannot be after endDate")
	}

	expenses, err := s.expenseRepo.GetByUserIDAndDateRange(ctx, userID, startDate, endDate, categoryID, subcategoryID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch expenses: %w", err)
	}

	return expenses, nil
}

func (s *ExpenseService) UpdateExpense(ctx context.Context, userID uuid.UUID, expenseID uuid.UUID, payload *ExpensePayload) (*database.Expense, error) {
	// Verify the expense exists and belongs to the user
	_, err := s.expenseRepo.GetByID(ctx, expenseID, userID)
	if err != nil {
		return nil, fmt.Errorf("expense not found: %w", err)
	}

	buenosAiresLoc, _ := time.LoadLocation("America/Argentina/Buenos_Aires")
	expenseDate, _ := time.ParseInLocation("2006-01-02", payload.Date, buenosAiresLoc)

	expense, err := s.expenseRepo.Update(
		ctx,
		expenseID,
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
		return nil, fmt.Errorf("failed to update expense: %w", err)
	}

	return expense, nil
}

func (s *ExpenseService) DeleteExpense(ctx context.Context, userID uuid.UUID, expenseID uuid.UUID) error {
	err := s.expenseRepo.Delete(ctx, expenseID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete expense: %w", err)
	}

	return nil
}

func (s *ExpenseService) AddInstallmentExpense(ctx context.Context, userID uuid.UUID, payload *ExpensePayload) ([]uuid.UUID, error) {
	if payload.InstallmentMonths < 1 {
		return nil, fmt.Errorf("installmentMonths must be at least 1")
	}

	buenosAiresLoc, _ := time.LoadLocation("America/Argentina/Buenos_Aires")
	startDate, _ := time.ParseInLocation("2006-01-02", payload.Date, buenosAiresLoc)

	paymentMethodUUID := uuid.MustParse(payload.PaymentMethodID)
	categoryUUID := uuid.MustParse(payload.CategoryID)

	var subcategoryUUID *uuid.UUID
	if payload.SubcategoryID != nil {
		parsed := uuid.MustParse(*payload.SubcategoryID)
		subcategoryUUID = &parsed
	}

	tx, err := s.db.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	installmentID, err := s.installmentExpenseRepo.InsertWithTx(ctx, tx, userID, payload.Description)
	if err != nil {
		return nil, fmt.Errorf("failed to insert installment expense: %w", err)
	}

	arsPerInstallment := payload.ArsAmount / float64(payload.InstallmentMonths)
	usdPerInstallment := payload.UsdAmount / float64(payload.InstallmentMonths)

	expenseIDs := make([]uuid.UUID, payload.InstallmentMonths)
	for i := 0; i < payload.InstallmentMonths; i++ {
		targetYear := startDate.Year()
		targetMonth := startDate.Month() + time.Month(i)

		for targetMonth > 12 {
			targetMonth -= 12
			targetYear++
		}

		originalDay := startDate.Day()
		lastDayOfMonth := time.Date(targetYear, targetMonth+1, 0, 0, 0, 0, 0, startDate.Location()).Day()

		day := originalDay
		if originalDay > lastDayOfMonth {
			day = lastDayOfMonth
		}

		installmentDate := time.Date(targetYear, targetMonth, day, 0, 0, 0, 0, startDate.Location())

		expense := &database.Expense{
			UserID:          userID,
			Description:     fmt.Sprintf("%s (%d/%d)", payload.Description, i+1, payload.InstallmentMonths),
			PaymentMethodID: paymentMethodUUID,
			ARSAmount:       arsPerInstallment,
			USDAmount:       usdPerInstallment,
			CategoryID:      categoryUUID,
			SubcategoryID:   subcategoryUUID,
			Date:            installmentDate,
		}

		id, err := s.expenseRepo.InsertWithTx(ctx, tx, expense, nil, &installmentID)
		if err != nil {
			return nil, fmt.Errorf("failed to insert expense %d: %w", i+1, err)
		}
		expenseIDs[i] = id
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return expenseIDs, nil
}

