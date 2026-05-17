<?php
namespace App\Models;
use Illuminate\Database\Eloquent\{Model,SoftDeletes};
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Note extends Model
{
    use SoftDeletes;
    protected $fillable = ['client_id','author_id','title','content','type','is_private'];
    protected $casts = ['is_private'=>'boolean'];
    public function client(): BelongsTo { return $this->belongsTo(User::class,'client_id'); }
    public function author(): BelongsTo { return $this->belongsTo(User::class,'author_id'); }
}
