#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9

#define RED_LED 7
#define GREEN_LED 6

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance.

enum SERVER_STATUS {
  ss_IDLE = 48,           // 0
  ss_READY_FOR_CARD = 49, // 1
  ss_ERROR = 50,          // 2
  ss_PONG = 51            // 3
};

static int server_status = ss_IDLE;

void setup() 
{
  Serial.begin(9600); // Initialize serial communications with the PC
  SPI.begin();      // Init SPI bus
  mfrc522.PCD_Init(); // Init MFRC522 card

  pinMode( RED_LED, OUTPUT );
  pinMode( GREEN_LED, OUTPUT );  
  digitalWrite( RED_LED, LOW );
  digitalWrite( GREEN_LED, LOW );
}

bool WaitForCard() {
  digitalWrite( RED_LED, LOW );
  digitalWrite( GREEN_LED, HIGH );
  // Look for new cards
  if ( ! mfrc522.PICC_IsNewCardPresent()) {
    return false;
  }

  // Select one of the cards
  if ( ! mfrc522.PICC_ReadCardSerial()) {
    return false;
  }
  
  mfrc522.PICC_HaltA();
  String cardId = String();
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    cardId.concat(mfrc522.uid.uidByte[i] < 0x10 ? "0" :"");
    cardId.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  
  Serial.println('card_id:' + cardId);

  for( short i = 0; i < 4; i++ )
  {
    digitalWrite( GREEN_LED, LOW );
    delay( 150 ); 
    digitalWrite( GREEN_LED, HIGH );
    delay( 150 );
  }
  digitalWrite( GREEN_LED, LOW );
  return true;
}

bool Idle() 
{
  digitalWrite( RED_LED, HIGH );
  digitalWrite( GREEN_LED, HIGH );
  if (Serial.available() > 0) 
  {
    server_status = Serial.read();
    if( server_status == ss_IDLE ) 
      return true;
    if( server_status == ss_READY_FOR_CARD || server_status == ss_ERROR )
    {
      digitalWrite( RED_LED, LOW );
      digitalWrite( GREEN_LED, LOW );
      return false;
    }
  }
  else if( server_status != ss_ERROR )  
    server_status = ss_IDLE;
}

bool Error() 
{
  digitalWrite( GREEN_LED, LOW );
  for( short i = 0; i < 5; i++ )
  {
    digitalWrite( RED_LED, LOW );
    delay( 200 ); 
    digitalWrite( RED_LED, HIGH );
    delay( 200 );
  }
  return true;
}

void loop() 
{
  if( Idle() )
    return;
  if( server_status == ss_READY_FOR_CARD )
  {
    int cycles = 0;
    while( !WaitForCard() && cycles < 300 )
      cycles++;
    server_status = ss_IDLE;
  }
  if( server_status == ss_ERROR )
  {
    Error();
  }
}

