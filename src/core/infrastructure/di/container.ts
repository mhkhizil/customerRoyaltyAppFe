import { HttpClient } from "../api/HttpClient";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ApiUserRepository } from "../repositories/ApiUserRepository";
import { ApiAuthRepository } from "../repositories/ApiAuthRepository";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import { ICustomerRepository } from "../../domain/repositories/ICustomerRepository";
import { ApiCustomerRepository } from "../repositories/ApiCustomerRepository";
import { IPointsRepository } from "../../domain/repositories/IPointsRepository";
import { ApiPointsRepository } from "../repositories/ApiPointsRepository";
import { IAuthService } from "../../domain/services/IAuthService";
import { AuthService } from "../../application/services/AuthService";
import { UserManagementService } from "../../application/services/UserManagementService";
import { CustomerManagementService } from "../../application/services/CustomerManagementService";
import { PointsService } from "../../application/services/PointsService";
import { ICustomerService } from "../../domain/services/ICustomerService";
import { IUserService } from "../../domain/services/IUserService";
import { IPointsService } from "../../domain/services/IPointsService";

/**
 * Dependency Injection Container
 * Registers concrete infrastructure/application implementations once.
 */
class Container {
  private instances: Map<string, unknown> = new Map();

  constructor() {
    this.initializeContainer();
  }

  private initializeContainer(): void {
    this.register("httpClient", new HttpClient());

    this.register<IUserRepository>(
      "userRepository",
      new ApiUserRepository(this.resolve("httpClient"))
    );

    this.register<IAuthRepository>(
      "authRepository",
      new ApiAuthRepository(this.resolve("httpClient"))
    );

    this.register<ICustomerRepository>(
      "customerRepository",
      new ApiCustomerRepository(this.resolve("httpClient"))
    );

    this.register<IPointsRepository>(
      "pointsRepository",
      new ApiPointsRepository(this.resolve("httpClient"))
    );

    this.register<IAuthService>(
      "authService",
      new AuthService(this.resolve("authRepository"))
    );

    this.register<IUserService>(
      "userService",
      new UserManagementService(this.resolve("userRepository"))
    );

    this.register<ICustomerService>(
      "customerService",
      new CustomerManagementService(this.resolve("customerRepository"))
    );

    this.register<IPointsService>(
      "pointsService",
      new PointsService(this.resolve("pointsRepository"))
    );
  }

  register<T>(key: string, instance: T): void {
    this.instances.set(key, instance);
  }

  resolve<T>(key: string): T {
    const instance = this.instances.get(key);
    if (!instance) {
      throw new Error(`No instance registered for key: ${key}`);
    }
    return instance as T;
  }
}

const container = new Container();

export default container;
