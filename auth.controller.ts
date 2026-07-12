import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/; // 8+ chars, upper, lower, digit, symbol

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_RULE, {
    message: 'Password must include upper, lower, number, and symbol (min 8 chars)',
  })
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_RULE, {
    message: 'Password must include upper, lower, number, and symbol (min 8 chars)',
  })
  newPassword: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
