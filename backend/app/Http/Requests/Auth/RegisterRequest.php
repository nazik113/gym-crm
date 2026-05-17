<?php
namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code'          => 'required|string|exists:registration_codes,code',
            'phone'         => 'required|string|unique:users,phone',
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'date_of_birth' => 'nullable|date',
            'password'      => 'required|string|min:6',
        ];
    }
}
