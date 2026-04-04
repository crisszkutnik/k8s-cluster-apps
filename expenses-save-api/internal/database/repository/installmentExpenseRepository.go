package repository

import (
	"context"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type InstallmentExpenseRepository struct {
	db *database.DatabaseService
}

func NewInstallmentExpenseRepository(db *database.DatabaseService) *InstallmentExpenseRepository {
	return &InstallmentExpenseRepository{db: db}
}

func (r *InstallmentExpenseRepository) InsertWithTx(ctx context.Context, tx pgx.Tx, userID uuid.UUID, description string) (uuid.UUID, error) {
	var id uuid.UUID

	err := tx.QueryRow(ctx, `
		INSERT INTO public.installements_expense (
			user_id,
			description
		) VALUES
		($1, $2)
		RETURNING id
	`,
		userID,
		description,
	).Scan(&id)

	return id, err
}
