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

func (r *PaymentMethodRepository) Insert(ctx context.Context, userID uuid.UUID, name string) (*database.PaymentMethod, error) {
	var pm database.PaymentMethod

	err := r.db.QueryRow(
		ctx,
		"INSERT INTO public.payment_method (user_id, name) VALUES ($1, $2) RETURNING id, user_id, name",
		userID,
		name,
	).Scan(&pm.Id, &pm.UserID, &pm.Name)
	if err != nil {
		return nil, err
	}

	return &pm, nil
}

func (r *PaymentMethodRepository) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, name string) (*database.PaymentMethod, error) {
	var pm database.PaymentMethod

	err := r.db.QueryRow(
		ctx,
		"UPDATE public.payment_method SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, user_id, name",
		name,
		id,
		userID,
	).Scan(&pm.Id, &pm.UserID, &pm.Name)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, pgx.ErrNoRows
		}
		return nil, err
	}

	return &pm, nil
}
