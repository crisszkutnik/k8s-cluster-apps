package repository

import (
	"context"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type PaymentMethodRepository struct {
	db *database.DatabaseService
}

func NewPaymentMethodRepository(db *database.DatabaseService) *PaymentMethodRepository {
	return &PaymentMethodRepository{db: db}
}

func (r *PaymentMethodRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]database.PaymentMethod, error) {
	rows, err := r.db.Query(
		ctx,
		"SELECT id, user_id, name FROM public.payment_method WHERE user_id = $1 ORDER BY name ASC",
		userID,
	)
	if err != nil {
		return nil, err
	}

	paymentMethods, err := pgx.CollectRows(rows, pgx.RowToStructByName[database.PaymentMethod])
	if err != nil {
		return nil, err
	}

	return paymentMethods, nil
}
