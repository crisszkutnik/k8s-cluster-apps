package repository

import (
	"context"

	"github.com/crisszkutnik/k8s-cluster-apps/expenses-save-api/internal/database"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type SubcategoryRepository struct {
	db *database.DatabaseService
}

func NewSubcategoryRepository(db *database.DatabaseService) *SubcategoryRepository {
	return &SubcategoryRepository{db: db}
}

func (r *SubcategoryRepository) GetByUserID(ctx context.Context, userId uuid.UUID) ([]database.Subcategory, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT
			sc.id,
			sc.category_id,
			sc.name
		FROM public.subcategory sc
		JOIN public.category c ON c.id = sc.category_id
		WHERE c.user_id = $1 ORDER BY name ASC;
		`,
		userId,
	)
	if err != nil {
		return nil, err
	}

	subcategories, err := pgx.CollectRows(rows, pgx.RowToStructByName[database.Subcategory])

	if err != nil {
		return nil, err
	}

	return subcategories, err
}
