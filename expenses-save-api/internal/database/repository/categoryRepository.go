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

func (r *CategoryRepository) Insert(ctx context.Context, userID uuid.UUID, name string) (*database.Category, error) {
	var c database.Category

	err := r.db.QueryRow(
		ctx,
		"INSERT INTO public.category (user_id, name) VALUES ($1, $2) RETURNING id, user_id, name",
		userID,
		name,
	).Scan(&c.Id, &c.UserID, &c.Name)
	if err != nil {
		return nil, err
	}

	return &c, nil
}

func (r *CategoryRepository) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, name string) (*database.Category, error) {
	var c database.Category

	err := r.db.QueryRow(
		ctx,
		"UPDATE public.category SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, user_id, name",
		name,
		id,
		userID,
	).Scan(&c.Id, &c.UserID, &c.Name)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, pgx.ErrNoRows
		}
		return nil, err
	}

	return &c, nil
}
