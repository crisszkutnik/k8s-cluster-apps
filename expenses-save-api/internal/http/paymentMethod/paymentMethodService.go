package paymentmethod

import (
	"context"
	"fmt"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type PaymentMethodService struct {
	paymentMethodRepo *repository.PaymentMethodRepository
}

type PaymentMethodPayload struct {
	Name string `json:"name" validate:"required"`
}

func NewPaymentMethodService(paymentMethodRepo *repository.PaymentMethodRepository) *PaymentMethodService {
	return &PaymentMethodService{
		paymentMethodRepo: paymentMethodRepo,
	}
}

func (s *PaymentMethodService) GetByUserID(ctx context.Context, userID uuid.UUID) ([]database.PaymentMethod, error) {
	return s.paymentMethodRepo.GetByUserID(ctx, userID)
}

func (s *PaymentMethodService) Insert(ctx context.Context, userID uuid.UUID, payload *PaymentMethodPayload) (*database.PaymentMethod, error) {
	pm, err := s.paymentMethodRepo.Insert(ctx, userID, payload.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to insert payment method: %w", err)
	}

	return pm, nil
}

func (s *PaymentMethodService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, payload *PaymentMethodPayload) (*database.PaymentMethod, error) {
	pm, err := s.paymentMethodRepo.Update(ctx, id, userID, payload.Name)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("payment method not found")
		}
		return nil, fmt.Errorf("failed to update payment method: %w", err)
	}

	return pm, nil
}
