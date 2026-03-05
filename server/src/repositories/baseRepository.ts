import { Model, Document, FilterQuery } from "mongoose";
import { QueryOptions, PaginatedResult } from "./types";

// ─── THE BASE ────────────────────────────────────────────────────
// Every collection repository extends this. You write CRUD once
// here, and every new collection (Message, GroupChat, AIAnalysis)
// gets it for free via `extends BaseRepository<TDocument>`.
//
// If you switch from Mongoose to Prisma/pg/anything:
//   1. Rewrite THIS file
//   2. Every child repository inherits the new implementation
//   3. Zero service changes
// ─────────────────────────────────────────────────────────────────

export class BaseRepository<TDocument extends Document> {
  constructor(protected readonly model: Model<TDocument>) {}

  // ── Full-featured findAll ────────────────────────────────────
  // Filter + sort + pagination + select + total count in one call.
  // Services never hand-roll this — they just pass QueryOptions.
  async findAll<TFilter = Record<string, unknown>>(
    options: QueryOptions<TFilter> = {}
  ): Promise<PaginatedResult<TDocument>> {
    const {
      filter = {},
      select,
      sort = { field: "createdAt", order: "desc" },
      pagination = { skip: 0, limit: 20 },
    } = options;

    const mongoFilter = filter as FilterQuery<TDocument>;
    const mongoSort = {
      [sort.field]: sort.order === "asc" ? 1 : -1,
    } as Record<string, 1 | -1>;
    const { skip, limit } = pagination;

    const query = this.model
      .find(mongoFilter)
      .sort(mongoSort)
      .skip(skip)
      .limit(limit);

    if (select) query.select(select.join(" "));

    const [data, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(mongoFilter).exec(),
    ]);

    return { data: data as TDocument[], total, skip, limit };
  }

  // ── Single record ───────────────────────────────────────────
  async findById(id: string): Promise<TDocument | null> {
    return this.model.findById(id).exec();
  }

  async findOne(
    filter: FilterQuery<TDocument>
  ): Promise<TDocument | null> {
    return this.model.findOne(filter).exec();
  }

  // ── Write operations ────────────────────────────────────────
  async create(data: Partial<TDocument>): Promise<TDocument> {
    return this.model.create(data) as Promise<TDocument>;
  }

  async updateById(
    id: string,
    data: Partial<TDocument>
  ): Promise<TDocument | null> {
    return this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // ── Utility ─────────────────────────────────────────────────
  async exists(filter: FilterQuery<TDocument>): Promise<boolean> {
    const count = await this.model
      .countDocuments(filter)
      .limit(1)
      .exec();
    return count > 0;
  }
}
