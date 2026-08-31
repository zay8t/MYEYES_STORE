enum UserRole {
  customer,
  optician,
  admin,
  superAdmin,
}

class Address {
  final String id;
  final String recipientName;
  final String phoneNumber;
  final String streetAddress;
  final String city;
  final String province;
  final String? postalCode;
  final bool isDefault;

  Address({
    required this.id,
    required this.recipientName,
    required this.phoneNumber,
    required this.streetAddress,
    required this.city,
    required this.province,
    this.postalCode,
    this.isDefault = false,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['id']?.toString() ?? '',
      recipientName: json['recipientName']?.toString() ?? '',
      phoneNumber: json['phoneNumber']?.toString() ?? '',
      streetAddress: json['streetAddress']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      province: json['province']?.toString() ?? 'Punjab',
      postalCode: json['postalCode']?.toString(),
      isDefault: json['isDefault'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'recipientName': recipientName,
      'phoneNumber': phoneNumber,
      'streetAddress': streetAddress,
      'city': city,
      'province': province,
      if (postalCode != null) 'postalCode': postalCode,
      'isDefault': isDefault,
    };
  }
}

class User {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final String? avatarUrl;
  final String? savedFaceShape;
  final bool isVerified;
  final List<Address> addresses;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.role = 'CUSTOMER',
    this.avatarUrl,
    this.savedFaceShape,
    this.isVerified = false,
    this.addresses = const [],
  });

  bool get isAdmin => role == 'ADMIN' || role == 'SUPER_ADMIN';

  factory User.fromJson(Map<String, dynamic> json) {
    var rawAddresses = json['addresses'];
    List<Address> addressList = [];
    if (rawAddresses is List) {
      addressList = rawAddresses.map((e) => Address.fromJson(e as Map<String, dynamic>)).toList();
    }

    return User(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      role: json['role']?.toString() ?? 'CUSTOMER',
      avatarUrl: json['avatarUrl']?.toString(),
      savedFaceShape: json['savedFaceShape']?.toString(),
      isVerified: json['isVerified'] == true,
      addresses: addressList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      if (phone != null) 'phone': phone,
      'role': role,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      if (savedFaceShape != null) 'savedFaceShape': savedFaceShape,
      'isVerified': isVerified,
      'addresses': addresses.map((e) => e.toJson()).toList(),
    };
  }
}
