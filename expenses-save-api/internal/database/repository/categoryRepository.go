package repository

import (
	"context"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type CategoryRepository struct {
	db *database.DatabaseService
}

func NewCategoryRepository(db *database.DatabaseService) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]database.Category, error) {
	rows, err := r.db.Query(
		ctx,
		"SELECT id, user_id, name FROM public.category WHERE user_id = $1 ORDER BY name ASC",
		userID,
	)
	if err != nil {
		return nil, err
	}

	categories, err := pgx.CollectRows(rows, pgx.RowToStructByName[database.Category])

	if err != nil {
		return nil, err
	}

	return categories, err
}
